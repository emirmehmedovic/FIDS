'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const templates = [
      {
        name: 'Divert - Technical',
        text_bs: 'Let iz {departure_city} preusmjeren je na aerodrom {new_airport}. Putnici će biti obaviješteni o daljnjim koracima.',
        text_en: 'Flight from {departure_city} has been diverted to {new_airport}. Passengers will receive further instructions.',
        text_de: 'Flug aus {departure_city} wurde zum Flughafen {new_airport} umgeleitet. Passagiere erhalten weitere Informationen.',
        text_tr: '{departure_city} seferi {new_airport} havalimanına yönlendirilmiştir. Yolculara bilgilendirme yapılacaktır.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Cancel - Weather',
        text_bs: 'Let iz {departure_city} za {destination_city} otkazan je zbog jakog nevremena. Molimo kontaktirajte vašu avio kompaniju.',
        text_en: 'Flight from {departure_city} to {destination_city} is canceled due to severe weather. Please contact your airline.',
        text_de: 'Flug von {departure_city} nach {destination_city} wurde wegen Unwettern storniert. Bitte kontaktieren Sie Ihre Fluggesellschaft.',
        text_tr: '{departure_city}-{destination_city} seferi, şiddetli hava koşulları nedeniyle iptal edildi. Lütfen havayolu şirketinizle iletişime geçin.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Divert - Weather',
        text_bs: 'Let {flight_number} preusmjeren je na aerodrom {new_airport} zbog nevremena u {destination_city}. Očekujte dodatne informacije.',
        text_en: 'Flight {flight_number} has been diverted to {new_airport} due to weather conditions in {destination_city}. Stay tuned for updates.',
        text_de: 'Flug {flight_number} wurde wegen Wetterbedingungen in {destination_city} nach {new_airport} umgeleitet. Bitte warten Sie auf weitere Informationen.',
        text_tr: '{destination_city}’daki hava koşulları nedeniyle {flight_number} seferi {new_airport}’a yönlendirilmiştir. Güncellemeler için bekleyin.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Delay - Weather',
        text_bs: 'Let iz {departure_city} kasni zbog nevremena. Novo vrijeme polijetanja: {time}.',
        text_en: 'Flight from {departure_city} is delayed due to weather. New departure time: {time}.',
        text_de: 'Flug aus {departure_city} ist wegen Wetterbedingungen verspätet. Neue Abflugzeit: {time}.',
        text_tr: '{departure_city} seferi hava koşulları nedeniyle ertelenmiştir. Yeni kalkış saati: {time}.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Divert - Alternatives',
        text_bs: 'Putnicima preusmjerenog leta {flight_number} ponuđeni su alternativni letovi. Molimo posjetite šalter {counter_number}.',
        text_en: 'Passengers of diverted flight {flight_number} are offered alternative flights. Please visit counter {counter_number}.',
        text_de: 'Passagiere des umgeleiteten Fluges {flight_number} erhalten alternative Flüge. Bitte besuchen Sie Schalter {counter_number}.',
        text_tr: 'Yönlendirilen {flight_number} seferi yolcularına alternatif uçuşlar sunulmuştur. Lütfen {counter_number} numaralı gişeye gidin.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Delay - Extended Weather',
        text_bs: 'Let {flight_number} kašni dodatnih {hours} sati zbog loših vremenskih prilika. Zahvaljujemo na strpljenju.',
        text_en: 'Flight {flight_number} is delayed by an additional {hours} hours due to adverse weather. Thank you for your patience.',
        text_de: 'Flug {flight_number} ist aufgrund widriger Wetterbedingungen um weitere {hours} Stunden verzögert. Vielen Dank für Ihre Geduld.',
        text_tr: '{flight_number} seferi, olumsuz hava koşulları nedeniyle {hours} saat daha ertelenmiştir. Sabrınız için teşekkürler.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Reschedule - After Cancel',
        text_bs: 'Otkazani let za {destination_city} ponovno je zakazan za {time}. Prijava počinje u {checkin_time}.', // Added {checkin_time} placeholder
        text_en: 'Canceled flight to {destination_city} has been rescheduled for {time}. Check-in opens at {checkin_time}.',
        text_de: 'Der stornierte Flug nach {destination_city} wurde auf {time} verschoben. Check-in ab {checkin_time}.',
        text_tr: 'İptal edilen {destination_city} seferi {time} için yeniden planlandı. Check-in işlemleri {checkin_time}’da başlayacak.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Divert - Transfer Info',
        text_bs: 'Putnici preusmjerenog leta {flight_number}, transfer do {destination_city} organiziran je autobusima iz zone {location}.',
        text_en: 'Passengers of diverted flight {flight_number}, transfers to {destination_city} are arranged via buses at {location}.',
        text_de: 'Passagiere des umgeleiteten Fluges {flight_number}, Transfer nach {destination_city} erfolgt per Bus ab {location}.',
        text_tr: '{flight_number} seferi yolcuları, {destination_city}’a transferler {location} noktasından otobüslerle sağlanacaktır.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Suspend - Storm Warning',
        text_bs: 'Zbog nadolazeće oluje, svi letovi su privremeno obustavljeni. Pratite najave za ažurirane informacije.',
        text_en: 'Due to an approaching storm, all flights are temporarily suspended. Follow announcements for updates.',
        text_de: 'Aufgrund eines nahenden Sturms sind alle Flüge vorübergehend ausgesetzt. Bitte verfolgen Sie die Durchsagen.',
        text_tr: 'Yaklaşan fırtına nedeniyle tüm uçuşlar geçici olarak durdurulmuştur. Güncellemeler için anonsları takip edin.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Evacuate - Extreme Weather',
        text_bs: 'Zbog ekstremnog nevremena, molimo sve putnike da napuste terminal i pridržavaju se instrukcija osoblja.',
        text_en: 'Due to extreme weather, all passengers must evacuate the terminal and follow staff instructions.',
        text_de: 'Aufgrund extremer Wetterbedingungen müssen alle Passagiere das Terminal verlassen und den Anweisungen folgen.',
        text_tr: 'Aşırı hava koşulları nedeniyle tüm yolcular terminali terk edip personel talimatlarına uymalıdır.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('notification_templates', templates, {});
  },

  async down (queryInterface, Sequelize) {
    // Remove only the templates added by this seeder based on their names
    const templateNames = [
      'Divert - Technical', 'Cancel - Weather', 'Divert - Weather', 'Delay - Weather',
      'Divert - Alternatives', 'Delay - Extended Weather', 'Reschedule - After Cancel',
      'Divert - Transfer Info', 'Suspend - Storm Warning', 'Evacuate - Extreme Weather'
    ];
    await queryInterface.bulkDelete('notification_templates', {
      name: { [Sequelize.Op.in]: templateNames }
    }, {});
  }
};
