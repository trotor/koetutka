import { View, Text, StyleSheet } from 'react-native';

/** Selittää koekorttien merkinnät ja eleet (Asetukset-välilehti). */
export function HelpSection() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Merkinnät ja käyttö</Text>

      <View style={styles.row}>
        <View style={styles.lead}><Text style={styles.star}>★</Text></View>
        <Text style={styles.text}>
          <Text style={styles.bold}>Suosikki.</Text> Napauta tähteä kortin oikeassa
          yläkulmassa. Suosikit löytyvät Suosikit-välilehdeltä, myös kalenterinäkymänä.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.lead}><Text style={styles.badgeFree}>Sopii</Text></View>
        <Text style={styles.text}>
          <Text style={styles.bold}>Mahtuu kalenteriin.</Text> Koe ei mene päällekkäin
          yhdenkään suosikkisi kanssa — voit osallistua.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.lead}><Text style={styles.badgeConflict}>Päällekkäin</Text></View>
        <Text style={styles.text}>
          <Text style={styles.bold}>Päällekkäin.</Text> Koe osuu samalle ajalle jonkin
          suosikkisi kanssa.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.lead}><Text style={styles.badgeHidden}>Piilotettu</Text></View>
        <Text style={styles.text}>
          <Text style={styles.bold}>Piilotettu koe.</Text> Piilota koe joka ei käy:
          paina koekorttia pitkään tai avaa kokeen tiedot → "Piilota koe". Saat piilotetut
          takaisin Filtterit → "Näytä piilotetut", ja palautat ne samalla tavalla.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.lead}><Text style={styles.badgePast}>Mennyt</Text></View>
        <Text style={styles.text}>
          <Text style={styles.bold}>Mennyt koe.</Text> Koe on jo pidetty. Menneet on
          oletuksena piilotettu (Filtterit → "Piilota menneet").
        </Text>
      </View>
    </View>
  );
}

const badge = {
  fontSize: 11,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
  overflow: 'hidden' as const,
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginTop: 12 },
  heading: { fontSize: 15, fontWeight: '700', color: '#1a472a', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
  lead: { width: 92, alignItems: 'flex-start', paddingTop: 1 },
  star: { fontSize: 18, color: '#d97706', marginLeft: 2 },
  text: { flex: 1, fontSize: 13, color: '#444', lineHeight: 18 },
  bold: { fontWeight: '700', color: '#1a472a' },
  badgeFree: { ...badge, color: '#15803d', backgroundColor: '#dcf0e2' },
  badgeConflict: { ...badge, color: '#9a3412', backgroundColor: '#fce8d5' },
  badgeHidden: { ...badge, color: '#555', backgroundColor: '#e0e0e0' },
  badgePast: { ...badge, color: '#777', backgroundColor: '#e0e0e0' },
});
