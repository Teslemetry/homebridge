# Tessie for Homebridge

Connect Homekit with all your Tesla vehicles using Tessie

## Installation

If you're running a Homebridge UI like [`homebridge-ui-config-x`](https://github.com/oznu/homebridge-config-ui-x) then you can use it to install `homebridge-tessie` and configure it there. All configuration options should be supported.

## Manual Installation

```sh
npm install --global homebridge-tessie
```

Example config.json:

```json
{
  "platforms": [
    {
      "platform": "Tessie",
      "name": "My Tessie",
      "accessToken": "YOUR_TESSIE_TOKEN",
      "prefixName": true,  
    }
  ]
}
```
