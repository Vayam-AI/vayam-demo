"use client";

import { FC } from "react";
import Lottie from "lottie-react";
import loadingAnimation from "../../../public/assets/loading.json";

interface LoadingProps {
  className?: string;
  width?: number;
  height?: number;
}

const Loading: FC<LoadingProps> = ({ className, width = 64, height = 64 }) => (
  <div className={`fixed inset-0 flex items-center justify-center bg-background z-50 ${className || ""}`}>
    <div style={{ width, height }}>
    <Lottie
      animationData={loadingAnimation}
      loop
      autoplay
        style={{ width: "100%", height: "100%" }}
    />
    </div>
  </div>
);

export default Loading;
