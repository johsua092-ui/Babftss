#!/usr/bin/env bash
#
# Toggle the OVR Metrics Tool performance HUD overlay on a connected Quest.
#
# Reference (verified 2025-12-05 via Meta docs):
#   https://developers.meta.com/horizon/documentation/native/android/ts-ovrmetricstool
#
# Prerequisites:
#   * adb on PATH (any Android Platform-Tools install)
#   * OVR Metrics Tool installed on the headset (Meta Horizon Store)
#   * Headset connected via USB or paired over WiFi
#
# Note: enabling the overlay for the first time may require a headset
# reboot before the HUD becomes visible.

set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") on|off" >&2
  echo "Toggles the OVR Metrics Tool performance HUD overlay on the connected Quest." >&2
  exit 1
}

[ $# -eq 1 ] || usage

receiver="com.oculus.ovrmonitormetricsservice/.SettingsBroadcastReceiver"

case "$1" in
  on)
    adb shell am broadcast -n "${receiver}" -a com.oculus.ovrmonitormetricsservice.ENABLE_OVERLAY
    ;;
  off)
    adb shell am broadcast -n "${receiver}" -a com.oculus.ovrmonitormetricsservice.DISABLE_OVERLAY
    ;;
  *)
    usage
    ;;
esac
