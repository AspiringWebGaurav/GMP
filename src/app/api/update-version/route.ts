import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { version } = await request.json();

    if (!version) {
      return NextResponse.json(
        { error: "Version is required" },
        { status: 400 }
      );
    }

    // Read package.json
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonContent);

    // Update version
    packageJson.version = version.replace("v", ""); // Remove 'v' prefix if present

    // Write back to package.json
    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      message: "Version updated successfully",
      version: packageJson.version,
    });
  } catch (error) {
    console.error("Error updating package.json:", error);
    return NextResponse.json(
      { error: "Failed to update package.json" },
      { status: 500 }
    );
  }
}
