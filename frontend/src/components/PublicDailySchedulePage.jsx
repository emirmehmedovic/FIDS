var PublicDailySchedulePage = function() {
  console.log("Rendering Basic Test Component..."); // Dodaj log
  return React.createElement('div', { 
      style: { // Dodaj inline stil za svaki slučaj
          backgroundColor: 'blue', 
          color: 'white', 
          padding: '50px', 
          fontSize: '30px' 
      } 
  }, 'TEST - RADI LI OVO?');
};
export default PublicDailySchedulePage;
