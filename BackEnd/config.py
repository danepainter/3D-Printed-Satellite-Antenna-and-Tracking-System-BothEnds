'''This file is used to configure the database and the API'''
'''set database path (?)'''
'''This file is used to configure the database and the API'''
'''set database path (?)'''
#JUSTIN ISARAPHANICH 9/3/2025 LAST MODIFIED
#CONFIG FILE

import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(basedir, "satellite.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable to save resources