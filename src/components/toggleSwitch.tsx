import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Switch } from "@/components/ui/switch"
interface Props{
    dark: boolean;
    setDark: React.Dispatch<React.SetStateAction<boolean>>;
}
export function ThemeToggleSwitch({dark, setDark}:Props) {

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch 
        checked={dark} 
        onCheckedChange={() => setDark((d) => !d)} 
        aria-label="Toggle theme"
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

