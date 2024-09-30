// src/components/MotionBox.tsx
import { Box, BoxProps } from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import { forwardRef } from 'react';

// Create a motion-enhanced Box component that forwards refs
const MotionBox = motion(
  forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
    const chakraProps = Object.fromEntries(
      // Filter out motion props and retain Chakra's props
      Object.entries(props).filter(([key]) => !isValidMotionProp(key))
    );
    return <Box ref={ref} {...chakraProps} />;
  })
);

export default MotionBox;
