import "@testing-library/jest-dom";

// Required for React 19 + testing-library in jsdom
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
