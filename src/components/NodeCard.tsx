import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NodeCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  tooltipContent: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const NodeCard = ({ 
  title, 
  description, 
  icon: Icon, 
  isActive, 
  tooltipContent,
  onClick,
  disabled = false
}: NodeCardProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            animate={{
              scale: isActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <Card 
              className={`
                relative p-6 transition-all duration-500 border-2
                ${isActive 
                  ? 'bg-gradient-to-br from-node-active/20 to-node-active/10 border-node-active node-glow-active' 
                  : 'bg-card border-border hover:border-node-active/50'
                }
                ${onClick && !disabled ? 'cursor-pointer hover:scale-105' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={!disabled && onClick ? onClick : undefined}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <motion.div
                  animate={{
                    rotate: isActive ? [0, 5, -5, 0] : 0,
                  }}
                  transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
                  className={`
                    p-4 rounded-full
                    ${isActive 
                      ? 'bg-node-active text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                    }
                  `}
                >
                  <Icon className="w-8 h-8" />
                </motion.div>
                
                <div>
                  <h3 className={`font-semibold text-lg ${isActive ? 'text-node-active' : 'text-foreground'}`}>
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                </div>

                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <div className="bg-node-active text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse-glow">
                      ✓
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
