# Teslemetry for Homebridge

Connect Homekit with all your Tesla vehicles and energy products using Teslemetry.

## Installation

If you're running a Homebridge UI like [`homebridge-ui-config-x`](https://github.com/oznu/homebridge-config-ui-x) then you can use it to install `homebridge-teslemetry` and configure it there. All configuration options should be supported.

## Manual Installation

```sh
npm install --global homebridge-teslemetry
```

Example config.json:

```json
{
  "platforms": [
    {
      "platform": "Teslemetry",
      "name": "My Teslemetry",
      "accessToken": "YOUR_TESLEMETRY_API_TOKEN",
      "prefixName": true,  
    }
  ]
}
```
