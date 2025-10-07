import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";

interface Log {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success';
}

interface LogsPanelProps {
  logs: Log[];
}

export const LogsPanel = ({ logs }: LogsPanelProps) => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-lg">Pipeline Logs</h3>
      </div>
      
      <ScrollArea className="h-64">
        <div className="space-y-2 font-mono text-sm">
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`p-2 rounded ${
                  log.type === 'success' 
                    ? 'text-node-active bg-node-active/10' 
                    : 'text-muted-foreground'
                }`}
              >
                <span className="text-accent mr-2">[{log.timestamp}]</span>
                {log.message}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {logs.length === 0 && (
            <div className="text-muted-foreground text-center py-8">
              Click "Start Pipeline" to begin the simulation
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
