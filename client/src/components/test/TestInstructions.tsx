import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, User } from "lucide-react";
import type { Test, Question } from "@shared/schema";

interface TestInstructionsProps {
  test: Test;
  questions: Question[];
  onBegin: () => void;
  isStarting: boolean;
}

export default function TestInstructions({ test, questions, onBegin, isStarting }: TestInstructionsProps) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-blue-600 text-white py-3 px-6">
        <h1 className="text-xl font-semibold" data-testid="text-test-title">{test.title}</h1>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-400">Instructions</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">General Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Total duration of examination is <strong>{test.duration} minutes</strong>.</li>
                    <li>The clock will be set at the server. The countdown timer in the top right corner will display the remaining time available for you to complete the examination.</li>
                    <li>The Question Palette displayed on the right side of screen will show the status of each question using symbols.</li>
                    <li>You have <strong>not visited</strong> the question yet (Gray).</li>
                    <li>You have <strong>not answered</strong> the question (Red).</li>
                    <li>You have <strong>answered</strong> the question (Green).</li>
                    <li>You have <strong>NOT answered</strong> the question, but have <strong>marked the question for review</strong> (Purple).</li>
                    <li>You have <strong>answered</strong> the question, but <strong>marked it for review</strong> (Purple).</li>
                  </ol>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Navigating to a Question:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground" start={9}>
                    <li>To answer a question, do the following:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Click on the question number in the Question Palette to go to that question directly.</li>
                        <li>Select an answer for a multiple choice type question. Use the virtual numeric keypad to enter a number as answer for a numerical type question.</li>
                        <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
                        <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <Separator />

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded">
                  <p className="text-xs text-amber-900 dark:text-amber-100">
                    I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. 
                    I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc.
                    I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button 
                  onClick={onBegin}
                  disabled={isStarting}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-start-test"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "I am ready to begin"
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            <Card className="p-4 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 mx-auto mb-3 flex items-center justify-center">
                <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold">Candidate</h3>
              <p className="text-sm text-muted-foreground">Test Taker</p>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Test Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{test.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Marks:</span>
                  <span className="font-medium">{test.totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
