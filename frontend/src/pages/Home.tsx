import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <section className="relative h-[80vh] bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-4 h-full flex items-center relative z-10">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl font-bold mb-4">Welcome to Savoria</h1>
            <p className="text-xl mb-8">Experience culinary excellence with our handcrafted dishes made from the finest ingredients.</p>
            <div className="flex gap-4">
              <Link to="/menu" className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-md transition">
                View Menu
              </Link>
              <Link to="/reservations" className="bg-white hover:bg-gray-100 text-gray-800 font-medium px-6 py-3 rounded-md transition">
                Reserve a Table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Specialties</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg overflow-hidden shadow-md transition hover:shadow-lg">
              <img src="/images/specialty-1.jpg" alt="Specialty dish" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Signature Pasta</h3>
                <p className="text-gray-600 mb-4">Our famous handmade pasta with a secret family sauce that has been passed down for generations.</p>
                <Link to="/menu" className="text-amber-600 hover:text-amber-700 font-medium">View Details →</Link>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden shadow-md transition hover:shadow-lg">
              <img src="/images/specialty-2.jpg" alt="Specialty dish" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Premium Steaks</h3>
                <p className="text-gray-600 mb-4">Perfectly aged and cooked to your preference, our steaks are sourced from the finest grass-fed cattle.</p>
                <Link to="/menu" className="text-amber-600 hover:text-amber-700 font-medium">View Details →</Link>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden shadow-md transition hover:shadow-lg">
              <img src="/images/specialty-3.jpg" alt="Specialty dish" className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Seafood Platter</h3>
                <p className="text-gray-600 mb-4">Fresh from the ocean, our seafood platter offers a delightful mix of flavors from the sea.</p>
                <Link to="/menu" className="text-amber-600 hover:text-amber-700 font-medium">View Details →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <img src="/images/restaurant-interior.jpg" alt="Restaurant interior" className="rounded-lg shadow-xl" />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-700 mb-4">
                Founded in 2010, Savoria has been serving exceptional cuisine to our valued guests for over a decade. 
                Our passion for food and dedication to quality has made us a beloved destination for food enthusiasts.
              </p>
              <p className="text-gray-700 mb-6">
                We believe in using locally-sourced, fresh ingredients to create memorable dining experiences. 
                Our team of award-winning chefs constantly innovate to bring you the best flavors from around the world.
              </p>
              <Link to="/reservations" className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-md inline-block transition">
                Reserve a Table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <img src="/images/customer-1.jpg" alt="Customer" className="w-12 h-12 rounded-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold">Sarah Johnson</h3>
                  <div className="flex text-amber-500">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">"The food was absolutely amazing! The service was impeccable and the atmosphere was perfect for our anniversary dinner."</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <img src="/images/customer-2.jpg" alt="Customer" className="w-12 h-12 rounded-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold">Michael Thompson</h3>
                  <div className="flex text-amber-500">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">"I've been coming here for years and the quality has never dropped. Their signature pasta is something you must try!"</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <img src="/images/customer-3.jpg" alt="Customer" className="w-12 h-12 rounded-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold">Emily Rodriguez</h3>
                  <div className="flex text-amber-500">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">"The chef accommodated my dietary restrictions without compromising on taste. Will definitely be returning soon!"</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
