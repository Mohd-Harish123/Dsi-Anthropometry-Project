// import { Tabs } from "expo-router";
import { Stack } from "expo-router";

export default function TabsLayout() {
  return (

<Stack>
      <Stack.Screen name="LoginRegister" options={{ title: 'Home' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}

