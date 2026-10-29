/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test";

/*
 * Nilai waktu pengujian. HARUS sama dengan src/helpers/timing.helper.ts
 * (LOAD_TIME & TEST_TIMEOUT, beserta dasar acuannya). Tidak di-import dari
 * sana karena config ini milik tsconfig.node.json (project composite):
 * meng-import file dari src/ membuat file itu wajib terdaftar di project
 * node dan bentrok dengan project utama (error TS6305).
 */
const LOAD_TIME = Number(process.env.LOAD_TIME_MS ?? 10000);
const TEST_TIMEOUT = 120_000;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Penantian assertion (expect) dibatasi LOAD_TIME, lihat timing.helper.ts */
  expect: {
    timeout: LOAD_TIME,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Tanpa pengulangan: kegagalan tidak boleh tersamarkan oleh retry */
  retries: 0,
  testDir: "./src/tests",
  /* Batas waktu satu test, sudah memperhitungkan think time (lihat TEST_TIMEOUT) */
  timeout: TEST_TIMEOUT,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Aksi & navigasi dibatasi LOAD_TIME */
    actionTimeout: LOAD_TIME,
    navigationTimeout: LOAD_TIME,

    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    screenshot: "on",
    trace: "retain-on-failure",
  },
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 10 : undefined,

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
