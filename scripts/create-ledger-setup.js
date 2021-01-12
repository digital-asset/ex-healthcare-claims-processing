const files = require('fs');

const [participantsFile, ledgerSetupConfigFile] = process.argv.slice(2)

const content = JSON.parse(files.readFileSync(participantsFile));

const partyParticipants = content.party_participants;

const displayNameToConfigName = {
  "primaryCareProvider": "provider1",
  "radiologist": "provider2",
  "patient1": "patient1",
  "operator": "operator",
  "insuranceCompany": "payer1"
}

const scriptVariableToPartyId = Object.entries(partyParticipants).map(entry => {
  const [partyId, displayName] = entry;
  const configName = displayNameToConfigName[displayName];
  return [configName, partyId];
});

const partiesConfig = Object.fromEntries(scriptVariableToPartyId);

const ledgerSetupConfig = {
  parties: partiesConfig
}

files.writeFileSync(ledgerSetupConfigFile, JSON.stringify(ledgerSetupConfig));

