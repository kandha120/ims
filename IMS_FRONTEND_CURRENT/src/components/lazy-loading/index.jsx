import React, { Suspense } from "react";

export const LazyWrapper = ({ children }) => (
  <Suspense fallback={null}>
    {children}
  </Suspense>
);
