import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="login"
        options={{ 
          title: "Login",
          href: null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ 
          title: "Dashboard",
          href: null,
        }}
      />
      <Tabs.Screen
        name="anthroscan"
        options={{ 
          title: "AnthroScan",
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ 
          title: "Profile",
          href: null,
        }}
      />
      <Tabs.Screen
        name="doctor_profile"
        options={{ 
          title: "Doctor Profile",
          href: null,
        }}
      />
      <Tabs.Screen
        name="doctor_dashboard"
        options={{ 
          title: "Doctor Dashboard",
          href: null,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{ 
          title: "Results",
          href: null,
        }}
      />
      <Tabs.Screen
        name="measurement_report"
        options={{ 
          title: "Measurement Report",
          href: null,
        }}
      />
      <Tabs.Screen
        name="growth_chart"
        options={{ 
          title: "Growth Chart",
          href: null,
        }}
      />
    </Tabs>
  );
}