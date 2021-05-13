#!/usr/bin/env python3
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

import json
import logging
import os
import requests
import signal
import socket
import subprocess
import sys
import time

DEFAULT_TRIGGER_SERVICE_PORT = 8088
DEFAULT_SANDBOX_PORT = 6865

logger = logging.getLogger(__name__)


def add_trigger_to_service(party, package_id, trigger):
    logger.info(f"Starting {package_id}:{trigger} as {party}")
    payload = {'triggerName': f'{package_id}:{trigger}', 'party': party}
    headers = {"Content-type": "application/json",
               "Accept": "application/json"}
    url = f'http://localhost:{DEFAULT_TRIGGER_SERVICE_PORT}/v1/triggers'
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()


def get_package_id(dar):
    result = subprocess.run(['daml', 'damlc', 'inspect-dar', '--json', dar], stdout=subprocess.PIPE)
    if result.returncode != 0:
        raise RuntimeError(result.stderr)
    inspect = json.loads(result.stdout)
    return inspect["main_package_id"]


def start_trigger_service_in_background(dar, sandbox_port = DEFAULT_SANDBOX_PORT):
    return _start_process_in_background(
        ["daml", "trigger-service", "--ledger-host", "localhost", "--ledger-port", f'{sandbox_port}',
         "--wall-clock-time", "--dar", dar, ])


def run_script(dar, script_name, sandbox_port = DEFAULT_SANDBOX_PORT):
    logger.debug("Running script...")
    return subprocess.run([
        "daml", "script", "--ledger-host", "localhost", "--ledger-port", f'{sandbox_port}', "--dar", dar,
        "--script-name", script_name
    ])


def kill_background_process(process):
    logger.debug("Killing subprocess...")
    try:
        # https://stackoverflow.com/questions/4789837/how-to-terminate-a-python-subprocess-launched-with-shell-true
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    except ProcessLookupError:
        logger.warning(f'Could not found subprocess to kill')


def wait_for_port(port: int, host: str = 'localhost', timeout: float = 5.0):
    # https://gist.github.com/butla/2d9a4c0f35ea47b7452156c96a4e7b12
    start_time = time.perf_counter()
    while True:
        try:
            with socket.create_connection((host, port), timeout=timeout):
                logger.info("Port is open")
                break
        except OSError as ex:
            if time.perf_counter() - start_time >= timeout:
                raise TimeoutError(f'Waited too long for the port {host}:{port}') from ex
            logger.info(f"Waiting for port {port}...")
            time.sleep(2)


def catch_signals():
    def signal_handler(_sig, _frame):
        logger.debug('Stopping gracefully...')
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)


def _start_process_in_background(args):
    logger.debug(f'Running background {args}...')
    # https://stackoverflow.com/questions/4789837/how-to-terminate-a-python-subprocess-launched-with-shell-true
    return subprocess.Popen(args, preexec_fn=os.setsid)
