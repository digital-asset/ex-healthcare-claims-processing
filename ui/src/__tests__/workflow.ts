///
/// Copyright (c) 2021, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
/// SPDX-License-Identifier: Apache-2.0
///

import { ChildProcess, spawn, spawnSync, SpawnOptions } from "child_process";
import puppeteer, { Browser } from "puppeteer";
import { Page } from "puppeteer";
import waitOn from "wait-on";

const UI_PORT = 3000;

let sandboxProc: ChildProcess | undefined = undefined;
let automationProc: ChildProcess | undefined = undefined;
let uiProc: ChildProcess | undefined = undefined;

let browser: Browser | undefined = undefined;

beforeAll(async () => {
  // Note(kill-npm-start): The `detached` flag starts the process in a new process group.
  // This allows us to kill the process with all its descendents after the tests finish,
  // following https://azimi.me/2014/12/31/kill-child_process-node-js.html.
  const launcherOpts: SpawnOptions = {
    stdio: "inherit",
    detached: true,
    cwd: "..",
  };

  sandboxProc = spawn("launchers/sandbox+populate", launcherOpts);
  automationProc = spawn("launchers/automation", launcherOpts);
  uiProc = spawnUI(launcherOpts);

  await waitOn({ resources: [`tcp:localhost:${UI_PORT}`] });
  await waitOn({ resources: [`tcp:localhost:7575`] });

  browser = await puppeteer.launch();
}, 120_000);

function spawnUI(opts: SpawnOptions) {
  // Disable automatically opening a browser using the env var described here:
  // https://github.com/facebook/create-react-app/issues/873#issuecomment-266318338
  const env = { ...process.env, BROWSER: "none" };
  return spawn("launchers/ui", { ...opts, env });
}

afterAll(async () => {
  //  TODO there may be still some hanging processes.
  if (uiProc?.pid) {
    process?.kill(-uiProc.pid);
  }
  if (automationProc?.pid) {
    process?.kill(-automationProc.pid);
  }
  if (sandboxProc?.pid) {
    process?.kill(-sandboxProc.pid);
  }
  if (browser) {
    await browser.close();
  }
});

test("Create referral", async () => {
  const page = await goToPage();
  await changeRole(page, "PrimaryCareProvider");

  await expectContentText(page, "#current-role", "PrimaryCareProvider");
  await changePage(page, "Patients");
  await expectContentText(page, "#title-test", "Patients");
  await clickFirstItemInTable(page);

  //await expectContentText(page, "#modal-button-text", "Refer Patient");
  //open referal modal and check
  await clickButton(page, "#modal-button");
  await expectContentText(page, ".heading-2xl", "Create Referral");

  //fill out fields referal modal
  await selectFirstItemSelectField(page, "policy");
  await expectContainText(page, ".contractId", "Contract ID:");

  await selectFirstItemSelectField(page, "diagnosisCode");
  await expectContainText(page, ".diagnosisCode__single-value", "Fracture");

  await setValueField(page, "encounterId", "test");
  await expectToHaveValue(page, '[name="encounterId"]', "test");

  await setValueField(page, "siteServiceCode", "test");
  await expectToHaveValue(page, '[name="siteServiceCode"]', "test");

  await selectFirstItemSelectField(page, "procedureCode");
  await expectContainText(page, ".procedureCode__single-value", "Preventive");

  await setValueField(page, "appointmentPriority", "test");
  await expectToHaveValue(page, '[name="appointmentPriority"]', "test");

  //submit referal form
  await clickButton(page, "#submit-button");
  await clickButton(page, "#close-modal-button");
}, 60_000);

test("Create appointemnt", async () => {
  const page = await goToPage("/provider/referrals");
  await changeRole(page, "Radiologist");
  await expectContentText(page, "#title-test", "Referrals");

  //move to referral page
  await clickFirstItemInTable(page);
  //create appointment modal
  await clickButton(page, "#modal-button");
  //await expectContentText(page, ".text-center", "Schedule Appointment");

  //submit appointment form
  await clickButton(page, "#submit-button");
}, 60_000);

test("Check-in patient", async () => {
  const page = await goToPage("/provider/appointments");
  await changeRole(page, "Radiologist");
  await expectContentText(page, "#title-test", "Appointments");

  //move to check-in page
  await clickFirstItemInTable(page);
  //create appointment modal
  await clickButton(page, "#modal-button");
  //await expectContentText(page, ".text-center", "Schedule Appointment");

  //submit appointment form
  await clickButton(page, "#submit-button");
}, 60_000);

test("Complete treatment", async () => {
  const page = await goToPage("/provider/treatments");
  await changeRole(page, "Radiologist");
  await expectContentText(page, "#title-test", "Treatments");

  await clickFirstItemInTable(page);
  //create appointment modal
  await clickButton(page, "#modal-button");

  //submit appointment form
  await clickButton(page, "#submit-button");
}, 60_000);

test("Pay insurance claim treatment", async () => {
  const page = await goToPage("/provider/claims");
  await changeRole(page, "InsuranceCompany");
  await expectContentText(page, "#title-test", "Claims");

  await clickFirstItemInTable(page);
  //create appointment modal
  await clickButton(page, "#modal-button");

  //submit appointment form
  await clickButton(page, "#submit-button");
}, 60_000);

test("Pay patient bill", async () => {
  const page = await goToPage("/patient/bills");
  await changeRole(page, "Patient1");
  await expectContentText(page, "#title-test", "Bills");

  await clickFirstItemInTable(page);
  //create appointment modal
  await clickButton(page, "#modal-button");

  //submit appointment form
  await clickButton(page, "#submit-button");
}, 60_000);

async function goToPage(path: string = "/"): Promise<Page> {
  if (!browser) {
    throw Error("Puppeteer browser has NOT been launched");
  }
  console.log("Puppeteer browser has been launched ");
  const page = await browser.newPage();
  await page.goto(`http://localhost:${UI_PORT}${path}`, {
    timeout: 0,
  });
  return page;
}

async function expectContentText(
  page: Page,
  selector: string,
  content: string
) {
  console.debug({ selector: selector, expectedContent: content });
  await page.waitForSelector(selector);
  console.debug(
    "currently: " + (await page.$eval(selector, (n) => n.innerText))
  );
  await page.waitForFunction(
    ([selector, content]) =>
      document.querySelector(selector)?.innerText === content,
    {},
    [selector, content]
  );
  console.debug("got expected content");
}

async function expectContainText(
  page: Page,
  selector: string,
  content: string
) {
  console.debug({ selector: selector, expectedContent: content });
  await page.waitForSelector(selector);
  console.debug(
    "currently: " + (await page.$eval(selector, (n) => n.innerText))
  );
  await page.waitForFunction(
    ([selector, content]) =>
      document.querySelector(selector)?.innerText.includes(content),
    {},
    [selector, content]
  );
  console.debug("got expected content");
}

async function expectToHaveValue(page: Page, selector: string, value: string) {
  console.debug({ selector: selector, expectedContent: value });
  await page.waitForSelector(selector);
  console.debug("currently: " + (await page.$eval(selector, (n) => n.value)));
  await page.waitForFunction(
    ([selector, value]) => document.querySelector(selector)?.value === value,
    {},
    [selector, value]
  );
  console.debug("got expected content");
}

async function changeRole(page: Page, role: string) {
  console.debug({ selector: role });
  var selector = `#${role}`;
  let element = await page.$("#current-role");
  var current = await element?.evaluate((el) => el.textContent);
  if (current && role !== current) {
    await page.click(".logout-button");
    page.click(selector);
  } else if (!current) {
    page.click(selector);
  }

  // document.querySelector(selector)?.click();
  console.debug(`Chanced role to ${role}`);
}

async function changePage(
  page: Page,
  label: string,
  isTable = false,
  tableTitle?: string
) {
  var selector = `#tab-link-${label}`;
  await page.click(selector);
  if (isTable) {
    await page.waitForSelector(`#test_table_${tableTitle}`);
  }
  // document.querySelector(selector)?.click();
  console.debug(`Chanced path to ${label}`);
}

async function clickFirstItemInTable(page: Page) {
  var selector = "#table-link-test-0";
  await page.waitForSelector(selector);
  await page.click(selector);
}

async function clickButton(page: Page, selector: string) {
  await page.waitForSelector(selector);
  await page.click(selector);
}

async function selectFirstItemSelectField(page: Page, name: string) {
  await page.click(`#${name}`);
  await page.focus(`#${name}`);

  await page.click(`.${name}__option`);
}

async function setValueField(page: Page, name: string, value: string) {
  await page.focus(`[name="${name}"`);
  await page.keyboard.type(value);
}
