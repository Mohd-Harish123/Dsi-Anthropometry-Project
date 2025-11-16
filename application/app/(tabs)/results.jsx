import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Results() {
  return (
    <ScrollView style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.title}>Measurement Report - Nov 10, 2025</Text>

        {/* Stat Grid */}
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text>Height</Text>
            <Text style={styles.statValue}>178.5</Text>
            <Text style={styles.statChange}>cm (Change: +0.5 cm)</Text>
          </View>

          <View style={styles.statCard}>
            <Text>Head Circ.</Text>
            <Text style={styles.statValue}>56.2</Text>
            <Text style={styles.statChange}>cm (Change: -0.1 cm)</Text>
          </View>

          <View style={styles.statCard}>
            <Text>Wrist Circ.</Text>
            <Text style={styles.statValue}>16.5</Text>
            <Text style={styles.statChange}>cm (No Change)</Text>
          </View>
        </View>

        {/* Detailed Table */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detailed Anthropometry (cm)</Text>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Height</Text>
            <Text style={styles.tableCell}>178.5</Text>
            <Text style={[styles.tableCell, { color: "red" }]}>↑ 0.5 cm</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Head Circ.</Text>
            <Text style={styles.tableCell}>56.2</Text>
            <Text style={[styles.tableCell, { color: "green" }]}>↓ 0.1 cm</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Wrist Circ.</Text>
            <Text style={styles.tableCell}>16.5</Text>
            <Text style={[styles.tableCell, { color: "gray" }]}>≈ 0 cm</Text>
          </View>
        </View>

        {/* Chart Placeholder */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trend Over Time (Height)</Text>

          <View style={styles.chartPlaceholder}>
            <Text>[Height Line Chart Placeholder]</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* Colors from your CSS */
  page: {
    backgroundColor: "#f2e9e4", // background
    flex: 1,
  },

  container: {
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
  },

  /* Stat Grid */
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "space-between",
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#b08968",
    flexGrow: 1,
    alignItems: "center",
    width: "30%",
  },

  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#7f5539",
    marginBottom: 5,
  },

  statChange: {
    fontSize: 14,
    marginTop: 5,
    color: "#333333",
  },

  /* Card */
  card: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    marginTop: 30,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },

  /* Table */
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#b08968",
  },

  tableCell: {
    flex: 1,
    fontSize: 16,
    color: "#333333",
  },

  /* Chart Placeholder */
  chartPlaceholder: {
    height: 150,
    backgroundColor: "#b0896833",
    marginTop: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
