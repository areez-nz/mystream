"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import DeviceUpload from "./DeviceUpload";
import GoogleDriveImport from "./GoogleDriveImport";

function UploadContent() {
  const searchParams = useSearchParams();
  const googleParam = searchParams.get("google");
  const [tab, setTab] = useState<"device" | "drive">(googleParam ? "drive" : "device");

  return (
    <div className="min-h-screen bg-[#0b0b0f]">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <h1 className="mb-1 text-2xl font-bold text-white sm:text-3xl">Add Movies to Your Library</h1>
        <p className="mb-8 text-white/60">
          Upload straight from your computer&apos;s hard drive, or pull videos in from your Google Drive.
        </p>

        <div className="mb-8 flex gap-2 border-b border-white/10">
          <button
            onClick={() => setTab("device")}
            className={`px-4 py-2.5 text-sm font-semibold transition ${
              tab === "device" ? "border-b-2 border-red-600 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            💻 From Your Hard Drive
          </button>
          <button
            onClick={() => setTab("drive")}
            className={`px-4 py-2.5 text-sm font-semibold transition ${
              tab === "drive" ? "border-b-2 border-red-600 text-white" : "text-white/50 hover:text-white"
            }`}
          >
            ☁️ From Google Drive
          </button>
        </div>

        {tab === "device" ? <DeviceUpload /> : <GoogleDriveImport googleParam={googleParam} />}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={null}>
      <UploadContent />
    </Suspense>
  );
}
