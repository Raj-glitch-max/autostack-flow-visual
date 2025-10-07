import { motion } from "framer-motion";

interface ConnectionLineProps {
  isActive: boolean;
  isVertical?: boolean;
}

export const ConnectionLine = ({ isActive, isVertical = false }: ConnectionLineProps) => {
  return (
    <div className={`relative ${isVertical ? 'h-16 w-1' : 'w-16 h-1'} mx-auto`}>
      <div className={`absolute ${isVertical ? 'left-0 w-full' : 'top-0 h-full'} bg-border ${isVertical ? 'h-full' : 'w-full'}`} />
      {isActive && (
        <motion.div
          initial={{ [isVertical ? 'height' : 'width']: '0%' }}
          animate={{ [isVertical ? 'height' : 'width']: '100%' }}
          transition={{ duration: 0.5 }}
          className={`absolute ${isVertical ? 'left-0 w-full' : 'top-0 h-full'} bg-gradient-to-${isVertical ? 'b' : 'r'} from-node-active to-accent`}
          style={{
            boxShadow: '0 0 10px hsl(var(--node-glow))',
          }}
        />
      )}
    </div>
  );
};
