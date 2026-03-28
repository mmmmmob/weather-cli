module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  moduleNameMapper: {
    "^(\\.\\.?\\/.+)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "./tsconfig.jest.json",
        diagnostics: {
          ignoreCodes: [2823, 151002],
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
};
