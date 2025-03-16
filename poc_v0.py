# %%
import geopandas as gpd
import folium
import pandas as pd
import os
import glob
import numpy as np

# %%
zcta_filepath = "data/tl_2022_us_zcta520.zip"
gdf = gpd.read_file(zcta_filepath)
gdf = gdf[['ZCTA5CE20', 'INTPTLAT20', 'INTPTLON20', 'geometry']]
gdf = gdf.rename(columns={
    'ZCTA5CE20': 'postal_code',
    'INTPTLAT20': 'lat',
    'INTPTLON20': 'long'
})

# %%
gdf.head()
gdf[gdf['postal_code'] == '98004'].explore()


# %%

# Find all DP05-Data.csv files in the data directory and its subdirectories
acsdp_filepaths = glob.glob("data/**/ACSDP5Y*.DP05-Data.csv", recursive=True)

# Create an empty list to store individual dataframes
acsdp_dfs = []

# Read each file and append to the list
for filepath in acsdp_filepaths:
    # Read the file with the first row as header, then skip the second row
    df = pd.read_csv(filepath, 
                     usecols=["NAME", "DP05_0001E"],
                     skiprows=[1])  # Skip the second row (index 1)
    
    # Add the year as a column (extracted from filename)
    year = os.path.basename(filepath).split('.')[0].replace('ACSDP5Y', '')
    df['year'] = int(year)  # Convert year to integer
    
    # Remove 'ZCTA5 ' prefix from NAME column
    df['NAME'] = df['NAME'].str.replace('ZCTA5 ', '')
    
    # Rename columns
    df = df.rename(columns={"NAME": "postal_code", "DP05_0001E": "population"})
    
    acsdp_dfs.append(df)

# Concatenate all dataframes into a single dataframe
acsdp_df = pd.concat(acsdp_dfs, ignore_index=True)

# Rearrange columns and sort by year, postal_code ascending
acsdp_df = acsdp_df[['postal_code', 'year', 'population']]
acsdp_df = acsdp_df.sort_values(by=['year', 'postal_code'], ascending=[True, True])

# Convert population to numeric, replacing any non-numeric values with NaN
acsdp_df['population'] = pd.to_numeric(acsdp_df['population'], errors='coerce')

# %%
acsdp_df.head()
acsdp_df[acsdp_df['postal_code'] == '33178']

# %%
# Get the latest year's population data
latest_year = acsdp_df['year'].max()
latest_population = acsdp_df[acsdp_df['year'] == latest_year][['postal_code', 'population']]

# Merge with the geodataframe
merged_gdf = gdf.merge(latest_population, on='postal_code', how='left')

# Display the first few rows of the merged geodataframe
merged_gdf.head()

# %%
# Example: Display a specific ZIP code with its population
merged_gdf[merged_gdf['postal_code'] == '98004'].explore()

# %%

# %%
def plot_node_postal_codes(node_data, merged_gdf):
    """
    Create a folium map showing postal code polygons colored by their nodes.
    
    Args:
        node_data (dict or str): Either a dictionary containing node data or path to JSON file
        merged_gdf (GeoDataFrame): GeoDataFrame containing postal code polygons and demographic data
    
    Returns:
        folium.Map: Map object with postal code polygons
    """
    import json
    import branca.colormap as cm
    import random
    
    # If node_data is a file path, load it
    if isinstance(node_data, str):
        with open(node_data, 'r') as f:
            node_data = json.load(f)
    
    # Create a mapping of postal codes to nodes
    postal_code_to_node = {}
    for node in node_data['nodes']:
        for postal_code in node['postal_code_list']:
            postal_code_to_node[str(postal_code)] = node['node']
    
    # Get relevant postal codes data
    relevant_postal_codes = merged_gdf[merged_gdf['postal_code'].isin(map(str, postal_code_to_node.keys()))]
    
    # Calculate center point
    center_lat = relevant_postal_codes['lat'].astype(float).mean()
    center_lon = relevant_postal_codes['long'].astype(float).mean()
    
    # Calculate appropriate zoom level based on the spread of points
    lat_spread = relevant_postal_codes['lat'].astype(float).max() - relevant_postal_codes['lat'].astype(float).min()
    lon_spread = relevant_postal_codes['long'].astype(float).max() - relevant_postal_codes['long'].astype(float).min()
    
    # Convert degree spread to approximate miles (rough approximation)
    max_spread_miles = max(
        lat_spread * 69.0,  # 1 degree lat ≈ 69 miles
        lon_spread * np.cos(np.radians(center_lat)) * 69.0  # 1 degree lon * cos(lat) ≈ miles
    )
    
    # Calculate zoom level based on spread
    # This is a rough approximation that works well for most cases
    if max_spread_miles < 1:
        zoom_level = 15
    elif max_spread_miles < 3:
        zoom_level = 14
    elif max_spread_miles < 7:
        zoom_level = 13
    elif max_spread_miles < 15:
        zoom_level = 12
    elif max_spread_miles < 30:
        zoom_level = 11
    elif max_spread_miles < 60:
        zoom_level = 10
    else:
        zoom_level = 9
    
    # Create a color mapping for each unique node
    nodes = list(set(postal_code_to_node.values()))
    colors = ['#%06x' % random.randint(0, 0xFFFFFF) for _ in range(len(nodes))]
    node_colors = dict(zip(nodes, colors))
    
    # Create the base map with calculated center point and zoom
    m = folium.Map(location=[center_lat, center_lon], zoom_start=zoom_level)
    
    # Add polygons for each postal code
    for idx, row in merged_gdf.iterrows():
        postal_code = row['postal_code']
        if postal_code in postal_code_to_node:
            node = postal_code_to_node[postal_code]
            color = node_colors[node]
            
            # Create the polygon with population info in tooltip
            population_info = f"<br>Population: {row['population']:,.0f}" if pd.notna(row['population']) else ""
            folium.GeoJson(
                row['geometry'],
                style_function=lambda x, color=color: {
                    'fillColor': color,
                    'color': 'black',
                    'weight': 1,
                    'fillOpacity': 0.6
                },
                tooltip=f"Postal Code: {postal_code}<br>Node: {node}{population_info}"
            ).add_to(m)
    
    # Add a legend
    legend_html = '''
    <div style="position: fixed; bottom: 50px; right: 50px; 
                background-color: white; padding: 10px; z-index: 1000;
                border-radius: 5px; border: 2px solid grey;">
    <h4>Nodes</h4>
    '''
    for node, color in node_colors.items():
        legend_html += f'''
        <div>
            <span style="background-color: {color}; display: inline-block; 
                       width: 20px; height: 20px; margin-right: 5px;"></span>
            {node}
        </div>
        '''
    legend_html += '</div>'
    m.get_root().html.add_child(folium.Element(legend_html))
    
    return m

# Example usage with Seattle Downtown only:
sample_data = {
    "nodes": [
        {
            "node": "Seattle_Downtown",
            "postal_code_list": [98101, 98104, 98121]
        },
        {
            "node": "Bellevue",
            "postal_code_list": [98004, 98005, 98006]
        },
        {
            "node": "Redmond",
            "postal_code_list": [98052, 98053, 98054]
        }
    ]
}

# Create and display the map using merged_gdf
seattle_map = plot_node_postal_codes(sample_data, merged_gdf)
seattle_map

# %%
