import psycopg2
import os

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "postgres"),
        dbname=os.getenv("POSTGRES_DB", "controltower"),
        user=os.getenv("POSTGRES_USER", "controltower_user"),
        password=os.getenv("POSTGRES_PASSWORD", "controltower_pass")
    )
