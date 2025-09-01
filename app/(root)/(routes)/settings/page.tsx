import { SubscriptionButton } from "@/components/subscription-button";
import { checkSubscription } from "@/lib/subscription";

const SettingsPage = async () => {
  let isPro = false;
  
  try {
    isPro = await checkSubscription();
  } catch (error) {
    console.error("Error checking subscription:", error);
    isPro = false; // Default to free plan on error
  }

  return ( 
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">
        {isPro ? "You are currently on a Pro plan." : "You are currently on a free plan."}
      </div>
      <SubscriptionButton isPro={isPro} />
    </div>
   );
}
 
export default SettingsPage;
