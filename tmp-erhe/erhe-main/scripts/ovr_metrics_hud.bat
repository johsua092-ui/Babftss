@echo off
setlocal

rem Toggle the OVR Metrics Tool performance HUD overlay on a connected Quest.
rem
rem Reference (verified 2025-12-05 via Meta docs):
rem   https://developers.meta.com/horizon/documentation/native/android/ts-ovrmetricstool
rem
rem Prerequisites:
rem   * Android SDK Platform-Tools (located via ANDROID_HOME or
rem     %LOCALAPPDATA%\Android\Sdk, same as install_android.bat)
rem   * OVR Metrics Tool installed on the headset (Meta Horizon Store)
rem   * Headset connected via USB or paired over WiFi
rem
rem Note: enabling the overlay for the first time may require a headset
rem reboot before the HUD becomes visible.

if "%ANDROID_HOME%"=="" (
    if exist "%LOCALAPPDATA%\Android\Sdk\" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    )
)
if "%ANDROID_HOME%"=="" (
    echo ERROR: ANDROID_HOME is not set and %%LOCALAPPDATA%%\Android\Sdk does not exist.
    exit /b 1
)
set "ADB=%ANDROID_HOME%\platform-tools\adb.exe"
if not exist "%ADB%" (
    echo ERROR: adb.exe not found at %ADB%
    exit /b 1
)

if "%~1"=="" goto usage
if /i "%~1"=="on"  goto enable
if /i "%~1"=="off" goto disable
goto usage

:enable
"%ADB%" shell am broadcast -n com.oculus.ovrmonitormetricsservice/.SettingsBroadcastReceiver -a com.oculus.ovrmonitormetricsservice.ENABLE_OVERLAY
exit /b %ERRORLEVEL%

:disable
"%ADB%" shell am broadcast -n com.oculus.ovrmonitormetricsservice/.SettingsBroadcastReceiver -a com.oculus.ovrmonitormetricsservice.DISABLE_OVERLAY
exit /b %ERRORLEVEL%

:usage
echo Usage: %~n0 on^|off
echo Toggles the OVR Metrics Tool performance HUD overlay on the connected Quest.
exit /b 1
