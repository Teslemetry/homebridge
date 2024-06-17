# Teslemetry for Home Bridge

Connect your Homekit with all your Teslemetry vehicles and energy products

## Installation

If you're running a Homebridge UI like [`homebridge-ui-config-x`](https://github.com/oznu/homebridge-config-ui-x) then you can use it to install `homebridge-teslemetry` and configure it there. All configuration options should be supported.

## Manual Installation

```sh
npm install --global homebridge-teslemetry
```

Example config.json:

```json
{
  "accessories": [
    {
      "accessory": "Teslemetry",
      "name": "Teslemetry",
      "accessToken": "abcdefg"
    }
  ]
}
```