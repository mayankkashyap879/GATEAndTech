import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay("0.");
      setNewNumber(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue !== null && operation && !newNumber) {
      // Perform pending operation first
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "*":
        return prev * current;
      case "/":
        return prev / current;
      default:
        return current;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display);
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
      setNewNumber(true);
    }
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    setDisplay(String(current / 100));
  };

  const handleToggleSign = () => {
    const current = parseFloat(display);
    setDisplay(String(-current));
  };

  const handleSquare = () => {
    const current = parseFloat(display);
    setDisplay(String(current * current));
  };

  const handleSquareRoot = () => {
    const current = parseFloat(display);
    setDisplay(String(Math.sqrt(current)));
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumber(e.key);
      }
      // Operations
      else if (e.key === "+") {
        e.preventDefault();
        handleOperation("+");
      } else if (e.key === "-") {
        e.preventDefault();
        handleOperation("-");
      } else if (e.key === "*") {
        e.preventDefault();
        handleOperation("*");
      } else if (e.key === "/") {
        e.preventDefault();
        handleOperation("/");
      }
      // Decimal
      else if (e.key === ".") {
        e.preventDefault();
        handleDecimal();
      }
      // Enter or equals
      else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
      }
      // Backspace
      else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      }
      // Clear
      else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleClear();
      }
      // Percent
      else if (e.key === "%") {
        e.preventDefault();
        handlePercent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [display, previousValue, operation, newNumber]);

  const buttons = [
    { label: "C", action: handleClear, className: "bg-orange-500 hover:bg-orange-600" },
    { label: "←", action: handleBackspace, className: "bg-gray-500 hover:bg-gray-600" },
    { label: "%", action: handlePercent, className: "bg-gray-500 hover:bg-gray-600" },
    { label: "/", action: () => handleOperation("/"), className: "bg-blue-500 hover:bg-blue-600" },
    
    { label: "7", action: () => handleNumber("7") },
    { label: "8", action: () => handleNumber("8") },
    { label: "9", action: () => handleNumber("9") },
    { label: "*", action: () => handleOperation("*"), className: "bg-blue-500 hover:bg-blue-600" },
    
    { label: "4", action: () => handleNumber("4") },
    { label: "5", action: () => handleNumber("5") },
    { label: "6", action: () => handleNumber("6") },
    { label: "-", action: () => handleOperation("-"), className: "bg-blue-500 hover:bg-blue-600" },
    
    { label: "1", action: () => handleNumber("1") },
    { label: "2", action: () => handleNumber("2") },
    { label: "3", action: () => handleNumber("3") },
    { label: "+", action: () => handleOperation("+"), className: "bg-blue-500 hover:bg-blue-600" },
    
    { label: "±", action: handleToggleSign },
    { label: "0", action: () => handleNumber("0") },
    { label: ".", action: handleDecimal },
    { label: "=", action: handleEquals, className: "bg-green-500 hover:bg-green-600" },
  ];

  const scientificButtons = [
    { label: "x²", action: handleSquare, className: "bg-purple-500 hover:bg-purple-600 text-xs" },
    { label: "√", action: handleSquareRoot, className: "bg-purple-500 hover:bg-purple-600" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Calculator</CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Display */}
          <div className="bg-gray-900 text-white p-4 rounded-lg text-right">
            <div className="text-sm text-gray-400 h-4">
              {previousValue !== null && operation
                ? `${previousValue} ${operation}`
                : ""}
            </div>
            <div className="text-3xl font-mono break-all">{display}</div>
          </div>

          {/* Scientific Functions */}
          <div className="grid grid-cols-2 gap-2">
            {scientificButtons.map((btn) => (
              <Button
                key={btn.label}
                onClick={btn.action}
                className={`h-10 font-semibold ${
                  btn.className || "bg-gray-700 hover:bg-gray-600"
                } text-white`}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Main Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {buttons.map((btn) => (
              <Button
                key={btn.label}
                onClick={btn.action}
                className={`h-12 text-lg font-semibold ${
                  btn.className || "bg-gray-700 hover:bg-gray-600"
                } text-white`}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Keyboard Hint */}
          <p className="text-xs text-center text-muted-foreground">
            Use keyboard: 0-9, +, -, *, /, Enter, Backspace, Escape
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
