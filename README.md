# CoWin-ator

This is the package to get Cowin slots and stats by state/district.

Please refer [API Documentation](https://hi-imcodeman.github.io/cowinator) here.

[![NPM](https://nodei.co/npm/cowinator.png)](https://nodei.co/npm/cowinator/)

## Installation

Install using 'npm'

```sh
npm i cowinator
```

Install using 'yarn'

```sh
yarn add cowinator
```

## Development Usage

```javascript
import { Cowinator } from "cowinator";

const client = new Cowinator();

// List of states having state_id and state_name
client.getStates().then((states) => {
  console.log(states);
});

// List of districts having district_id and district_name
const state_id = 2; // state_d:2 for 'Andhra Pradesh'
client.getDistricts(state_id).then((districts) => {
  console.log(districts);
});

// Get stats for specified state
client.getStatsByState(state_id).then((stats) => {
  console.log(stats);
});

const district_id = 571; // district_id:571 for 'Chennai'
// Get stats for specified state
client.getStatsByDistrict(district_id).then((stats) => {
  console.log(stats);
});

// Get list of sessions for a district
client.findByDistrict(district_id).then((sessions) => {
  console.log(sessions);
});

// Find state_id by search string
client.findStateByName("tamil").then((matchedState) => {
  console.log(matchedState); // Will get state_id and state_name for 'tamil nadu'
});

// Find state_id by search string
client.findDistrictByName(state_id, "east").then((matchedDistrict) => {
  console.log(matchedDistrict); // Will get district_id and district_name for 'East Godavari'
});
```

## CLI

We can use this package in CLI.

Install for CLI

```sh
npm i -g cowinator
```

### CLI Usage

To get the stats for a state

```sh
cowinator andhra
```

To get the stats for a particular district in a state

```sh
cowinator "tamil nadu" --district chennai
```

To post the stats to the telegram channel.

`Note: Please assign your bot token to 'TELEGRAM_BOT_TOKEN' as environment variable.`

```sh
cowinator "tamil nadu" --district chennai --tgChannel "@channelname"
```
