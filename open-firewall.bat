@echo off
echo Открываю порт 3000 для локальной сети...
netsh advfirewall firewall delete rule name="Magnifique Dev 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Magnifique Dev 3000" dir=in action=allow protocol=TCP localport=3000
echo.
echo Готово! Порт 3000 открыт.
pause
