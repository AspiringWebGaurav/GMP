import React from "react";
import { VERSION } from "../app/config/version";

export default function Version() {
  return <span className="text-sm text-zinc-500">{VERSION}</span>;
}
