import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #3B82F6 100%)",
          borderRadius: "40px",
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized 'G' for Gaurav */}
          <path
            d="M24 12C17.4 12 12 17.4 12 24C12 30.6 17.4 36 24 36C27.3 36 30.3 34.5 32.4 32.1L28.8 28.5C27.6 29.7 25.9 30.5 24 30.5C20.4 30.5 17.5 27.6 17.5 24C17.5 20.4 20.4 17.5 24 17.5C25.9 17.5 27.6 18.3 28.8 19.5L32.4 15.9C30.3 13.5 27.3 12 24 12Z"
            fill="white"
            opacity="0.95"
          />

          {/* Management Panel indicator */}
          <rect
            x="26"
            y="22"
            width="8"
            height="2"
            rx="1"
            fill="white"
            opacity="0.9"
          />
          <rect
            x="26"
            y="26"
            width="6"
            height="2"
            rx="1"
            fill="white"
            opacity="0.75"
          />
          <rect
            x="26"
            y="30"
            width="4"
            height="2"
            rx="1"
            fill="white"
            opacity="0.6"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
