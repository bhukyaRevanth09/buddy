export default function ActiveJobScreen({ route, navigation }) {

  const { booking } = route.params;

  const [status, setStatus] = useState("accepted");
  const [loading, setLoading] = useState(false);

  const update = async (endpoint, next) => {

    try {

      setLoading(true);

      const res = await api.post(`/booking/${endpoint}`, {
        bookingId: booking._id
      });

      if (res.data.success) {

        if (endpoint === "complete") {

          navigation.replace("BuddyHome");
          return;
        }

        setStatus(next);
      }

    } catch {
      alert("failed");
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>
        Booking Active
      </Text>

      {status === "accepted" && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => update("arrived", "arrived")}
        >
          <Text>I ARRIVED</Text>
        </TouchableOpacity>
      )}

      {status === "arrived" && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => update("start", "started")}
        >
          <Text>START</Text>
        </TouchableOpacity>
      )}

      {status === "started" && (
        <TouchableOpacity
          style={styles.btn}
          onPress={() => update("complete", "completed")}
        >
          <Text>COMPLETE</Text>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}