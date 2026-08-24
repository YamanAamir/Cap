import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

function safeParseJson(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(value);
        return safeParseJson(parsed);
      } catch (e) {
        return value;
      }
    }
  }
  if (Array.isArray(value)) {
    return value.map(safeParseJson);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const parsedObj = {};
    for (const key of Object.keys(value)) {
      parsedObj[key] = safeParseJson(value[key]);
    }
    return parsedObj;
  }
  return value;
}

const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch(...args);
  const originalJson = response.json;
  response.json = async function () {
    const data = await originalJson.call(this);
    return safeParseJson(data);
  };
  return response;
};

//  basename="/devstudentlife"
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/devstudentlife">
    <App />
  </BrowserRouter>
);
