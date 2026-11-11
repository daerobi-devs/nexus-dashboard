@echo off
title Nexus Desktop Command Center (Local SQLite)
cd /d "%~dp0"
echo Menyalakan Nexus Desktop Command Center (SQLite: data\nexus.db)...
start "" msedge --app=http://127.0.0.1:5173 --window-size=1440,900
npm run dev
