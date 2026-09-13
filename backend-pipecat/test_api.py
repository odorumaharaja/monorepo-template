import sys
import os

from fastapi import FastAPI
# Just trying to import api.py to see if it syntax checks.
sys.path.append(os.path.join(os.getcwd(), 'src'))
try:
    import api
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
