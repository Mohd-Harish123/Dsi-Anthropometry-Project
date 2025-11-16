import { Link } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const COLORS = {
  background: "#f2e9e4",
  surface: "#ffffff",
  text: "#333333",
  accentLight: "#b08968",
  accentDark: "#7f5539",
};

export default function Home() {
  return (
    
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
      }}
    >
      {/* Welcome Card */}
      <View
        style={{
          backgroundColor: COLORS.surface,
          padding: 30,
          borderRadius: 8,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 6,
          marginBottom: 25,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "600",
            marginBottom: 10,
            color: COLORS.text,
          }}
        >
          Welcome Back, Alex!
        </Text>

        <Text
          style={{
            fontSize: 16,
            textAlign: "center",
            marginBottom: 25,
            color: COLORS.text,
          }}
        >
          Ready to track your progress? Tap below to capture your latest
          measurements.
        </Text>

        <Link href="/anthroscan" asChild>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.accentDark,
              paddingVertical: 15,
              paddingHorizontal: 30,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                color: COLORS.surface,
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              Start New Measurement
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Quick Stats */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: "600",
          marginBottom: 15,
          color: COLORS.text,
        }}
      >
        Quick Glance
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <StatBox label="Last Measured" value="2 days ago" sub="(Nov 8th)" />
        <StatBox
          label="Weight Change (30 Days)"
          value="↓ 1.2 kg"
          color="green"
          sub="Target Tracking"
        />
        <StatBox label="Current BMI" value="22.9" sub="Requires New Photo" />
      </View>

      {/* Recent Activity */}
      <View
        style={{
          backgroundColor: COLORS.surface,
          padding: 20,
          borderRadius: 8,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 6,
          marginTop: 30,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            marginBottom: 15,
            color: COLORS.text,
          }}
        >
          Recent Activity
        </Text>

        <ActivityItem
          text="Nov 8, 2025: Analysis complete. Waist decreased by 1.0 cm."
          link="/results"
        />
        <ActivityItem
          text="Oct 25, 2025: Initial Baseline Measurement Uploaded."
          link="/results"
        />
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value, sub, color }) {
  return (
    <View
      style={{
        width: "48%",
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.accentLight,
      }}
    >
      <Text style={{ fontSize: 15, marginBottom: 5, color: COLORS.text }}>
        {label}
      </Text>

      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: color ? color : COLORS.accentDark,
          marginBottom: 3,
        }}
      >
        {value}
      </Text>

      <Text style={{ marginTop: 4, color: COLORS.accentLight }}>{sub}</Text>
    </View>
  );
}

function ActivityItem({ text, link }) {
  return (
    <View
      style={{
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.accentLight,
        paddingBottom: 8,
      }}
    >
      <Text style={{ marginBottom: 5, color: COLORS.text }}>{text}</Text>

      <Link href={link}>
        <Text style={{ color: COLORS.accentDark }}>View Details →</Text>
      </Link>
    </View>
  );
}
