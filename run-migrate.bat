@echo off
cd /d c:\loja\backend
node_modules\.bin\prisma.cmd migrate deploy > migrate_output.txt 2>&1
echo Exit code: %ERRORLEVEL% >> migrate_output.txt
