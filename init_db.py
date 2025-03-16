import geopandas as gpd
import pandas as pd
import psycopg2
from sqlalchemy import create_engine
import os
import glob
from geoalchemy2 import Geometry
from pathlib import Path
from dotenv import load_dotenv

def load_config():
    """Load configuration from environment variables or .env file"""
    # Load environment variables from .env file if it exists
    load_dotenv()
    
    # Initialize config with environment variables, falling back to defaults
    config = {
        "database": {
            "user": os.getenv("DB_USER", "jinwooje"),
            "host": os.getenv("DB_HOST", "localhost"),
            "port": os.getenv("DB_PORT", "5432"),
            "database": os.getenv("DB_NAME", "jstdb"),
            "password": os.getenv("DB_PASSWORD", "")
        },
        "data": {
            "zcta_filepath": os.getenv("ZCTA_FILEPATH", "data/tl_2022_us_zcta520.zip"),
            "acsdp_pattern": os.getenv("ACSDP_PATTERN", "data/**/ACSDP5Y*.DP05-Data.csv")
        }
    }
    
    return config

def get_db_url(db_config):
    """Construct database URL from config"""
    password_str = f":{db_config['password']}" if db_config['password'] else ""
    return f"postgresql://{db_config['user']}{password_str}@{db_config['host']}:{db_config['port']}/{db_config['database']}"

def init_postgis(db_config):
    """Initialize PostGIS extension if not already enabled"""
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        conn.commit()
        print("PostGIS extension enabled successfully")
    except Exception as e:
        print(f"Error enabling PostGIS extension: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

def load_data(config):
    """Load GeoDataFrames and DataFrames into PostgreSQL"""
    # Create SQLAlchemy engine
    engine = create_engine(get_db_url(config['database']))
    
    try:
        # Load and prepare geodataframe (gdf)
        zcta_filepath = config['data']['zcta_filepath']
        gdf = gpd.read_file(zcta_filepath)
        gdf = gdf[['ZCTA5CE20', 'INTPTLAT20', 'INTPTLON20', 'geometry']]
        gdf = gdf.rename(columns={
            'ZCTA5CE20': 'postal_code',
            'INTPTLAT20': 'lat',
            'INTPTLON20': 'long'
        })
        
        # Load gdf to PostgreSQL
        gdf.to_postgis(
            name='zip_codes',
            con=engine,
            if_exists='replace',
            index=False,
            dtype={'geometry': Geometry('MULTIPOLYGON', srid=4326)}
        )
        print("Successfully loaded zip_codes table")
        
        # Load and prepare ACSDP data
        acsdp_dfs = []
        acsdp_filepaths = glob.glob(config['data']['acsdp_pattern'], recursive=True)
        
        for filepath in acsdp_filepaths:
            df = pd.read_csv(filepath, 
                           usecols=["NAME", "DP05_0001E"],
                           skiprows=[1])
            
            year = os.path.basename(filepath).split('.')[0].replace('ACSDP5Y', '')
            df['year'] = int(year)
            df['NAME'] = df['NAME'].str.replace('ZCTA5 ', '')
            df = df.rename(columns={"NAME": "postal_code", "DP05_0001E": "population"})
            acsdp_dfs.append(df)
        
        acsdp_df = pd.concat(acsdp_dfs, ignore_index=True)
        acsdp_df = acsdp_df[['postal_code', 'year', 'population']]
        acsdp_df = acsdp_df.sort_values(by=['year', 'postal_code'], ascending=[True, True])
        acsdp_df['population'] = pd.to_numeric(acsdp_df['population'], errors='coerce')
        
        # Load acsdp_df to PostgreSQL
        acsdp_df.to_sql(
            name='zip_demographics',
            con=engine,
            if_exists='replace',
            index=False
        )
        print("Successfully loaded zip_demographics table")
        
    except Exception as e:
        print(f"Error loading data: {e}")
    finally:
        engine.dispose()

def main():
    """Main function to initialize database and load data"""
    print("Loading configuration...")
    config = load_config()
    
    print("Initializing PostGIS...")
    init_postgis(config['database'])
    
    print("\nLoading data into PostgreSQL...")
    load_data(config)
    
    print("\nDatabase initialization complete!")

if __name__ == "__main__":
    main() 