/*
 * Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
module.exports = {
  style: {
    postcss: {
      plugins: [
        require("tailwindcss"),
        require("autoprefixer"),
        require("postcss-for"),
      ],
    },
  },
};
