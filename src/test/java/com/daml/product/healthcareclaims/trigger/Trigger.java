/*
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.daml.product.healthcareclaims.trigger;

import static org.junit.Assert.fail;

import java.io.File;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import org.apache.commons.io.input.Tailer;
import org.apache.commons.io.input.TailerListenerAdapter;
import org.junit.rules.ExternalResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Trigger extends ExternalResource {
  private final Logger logger;

  private final String darPath;
  private final String triggerName;
  private final String ledgerHost;
  private final Supplier<String> ledgerPort;
  private final String party;
  private final String timeMode;
  private final File logFile;

  private Process trigger;

  Trigger(
      String darPath,
      String triggerName,
      String ledgerHost,
      Supplier<String> ledgerPort,
      String party,
      String timeMode) {
    this.darPath = darPath;
    this.triggerName = triggerName;
    this.ledgerHost = ledgerHost;
    this.ledgerPort = ledgerPort;
    this.party = party;
    this.timeMode = timeMode;
    this.logger =
        LoggerFactory.getLogger(
            String.format("%s: %s-%s", getClass().getCanonicalName(), triggerName, party));
    this.logFile = new File(String.format("integration-test-%s-%s.log", triggerName, party));
  }

  public static Builder builder() {
    return new Builder();
  }

  private void start() throws Throwable {
    ProcessBuilder processBuilder = createProcess();
    Map<String, String> environment = processBuilder.environment();
    environment.put("JAVA_TOOL_OPTIONS", "-Xmx128m");
    logger.debug("Executing: {}", String.join(" ", processBuilder.command()));
    trigger = processBuilder.start();

    if (!waitForTriggerToStart()) {
      fail("Trigger did not start within timeout.");
    }

    logger.info("Started.");
  }

  private ProcessBuilder createProcess() {
    return command()
        .redirectError(ProcessBuilder.Redirect.appendTo(logFile))
        .redirectOutput(ProcessBuilder.Redirect.appendTo(logFile));
  }

  private ProcessBuilder command() {
    return new ProcessBuilder()
        .command(
            "daml",
            "trigger",
            timeMode,
            "--dar",
            darPath,
            "--trigger-name",
            triggerName,
            "--ledger-host",
            ledgerHost,
            "--ledger-port",
            ledgerPort.get(),
            "--ledger-party",
            party);
  }

  private boolean waitForTriggerToStart() throws InterruptedException {
    final CountDownLatch hasStarted = new CountDownLatch(1);
    Tailer tailer =
        new Tailer(
            logFile,
            new TailerListenerAdapter() {
              @Override
              public void handle(String line) {
                // FIXME: Trigger is broken, mind the double space.
                if (line != null && line.contains("Trigger  is running")) {
                  hasStarted.countDown();
                } else {
                  logger.debug("Waiting for trigger...");
                }
              }
            },
            0L,
            true);
    ExecutorService executor = Executors.newSingleThreadExecutor();
    executor.submit(tailer);

    try {
      return hasStarted.await(30L, TimeUnit.SECONDS);
    } catch (InterruptedException e) {
      return false;
    } finally {
      tailer.stop();
      executor.shutdown();
      //noinspection ResultOfMethodCallIgnored
      executor.awaitTermination(10L, TimeUnit.SECONDS);
    }
  }

  private void stop() {
    try {
      trigger.destroyForcibly().waitFor();
    } catch (InterruptedException e) {
      logger.error("Could not stop trigger.", e);
    }
  }

  @Override
  protected void before() throws Throwable {
    super.before();
    start();
  }

  @Override
  protected void after() {
    stop();
    super.after();
  }
}
