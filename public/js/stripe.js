import axios from 'axios';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51N1LT8E3hDmdiOshJSxoOkIJuzQkyKdSh2jEWpc7Lr2p163XpZADJe1rCCuasCYoC4cxKb0BNMwforRMAhqlOzVk00CxtLRewF'
  );

  //get the session from api
  const session = await axios(`/api/v1/bookings/check-out/${tourId}`);

  await stripe.redirectToCheckout({
    sessionId: session.data.session.id,
  });
};
