from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import fdb

# CAMINHO DO CLIENTE FIREBIRD
fdb.load_api(r"C:\Program Files (x86)\Firebird\Firebird_3_0\fbclient.dll")

ERP_DATABASE_URL = "firebird+fdb://SYSDBA:masterkey@localhost:3050/C:/DATAGOO CLIENTES/Clientes Firebird 3/Dados/Danifil/DADOS.FDB"

erp_engine = create_engine(ERP_DATABASE_URL)

ERP_SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=erp_engine
)

def get_erp_db():
    db = ERP_SessionLocal()
    try:
        yield db
    finally:
        db.close()