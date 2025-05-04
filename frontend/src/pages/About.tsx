import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { Award, Users, Utensils, Heart } from 'lucide-react';

const About = () => {
  const { settings } = useSettings();

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  const staggerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Hero Section */}
      <section className="relative h-[50vh] bg-cover bg-center flex items-center" style={{ backgroundImage: "url('/images/about-hero.jpg')" }}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Our Story
          </motion.h1>
          <motion.div 
            className="h-1 w-24 bg-amber-500 mx-auto mb-6"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          ></motion.div>
          <motion.p 
            className="text-xl text-white/90 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Discover the passion and dedication behind {settings.restaurant_name}
          </motion.p>
        </div>
      </section>

      {/* Our History */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our History</h2>
              <div className="h-1 w-16 bg-amber-500 mx-auto mb-8"></div>
              <p className="text-gray-600 leading-relaxed">
                Founded in 2010, {settings.restaurant_name} began as a small family-owned bistro with a passion for creating exceptional culinary experiences. 
                What started as a dream has grown into one of the most beloved dining destinations in the city.
              </p>
            </div>

            <motion.div 
              className="grid md:grid-cols-2 gap-16 items-center"
              variants={staggerVariants}
            >
              <motion.div variants={itemVariants}>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">A Culinary Journey</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Our restaurant was established with a simple mission: to serve incredible food made with the freshest ingredients in an inviting atmosphere.
                  Chef Michael Roberts, our founder, brought his expertise from his travels across Europe and Asia to create a menu that celebrates both innovation and tradition.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Over the years, we've expanded our space, refined our menu, and built a team of passionate culinary experts. 
                  Despite our growth, we've never lost sight of what makes us special: our commitment to quality, hospitality, and creating memorable dining experiences.
                </p>
              </motion.div>
              <motion.div 
                variants={itemVariants}
                className="relative"
              >
                <img 
                  src="/images/restaurant-history.jpg" 
                  alt="Restaurant history" 
                  className="rounded-lg shadow-xl z-10 relative w-full h-auto"
                />
                <div className="absolute inset-0 border-2 border-amber-500 rounded-lg transform translate-x-4 translate-y-4 z-0"></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our Values</h2>
            <div className="h-1 w-16 bg-amber-500 mx-auto mb-8"></div>
            <p className="text-gray-600 max-w-3xl mx-auto">
              At {settings.restaurant_name}, we're guided by a set of core values that influence everything we do—from how we source our ingredients to how we serve our guests.
            </p>
          </div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerVariants}
            initial="initial"
            animate="animate"
          >
            <motion.div 
              className="bg-white p-8 rounded-xl shadow-md text-center"
              variants={itemVariants}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
                <Utensils className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Quality Food</h3>
              <p className="text-gray-600">
                We use only the freshest, highest-quality ingredients, sourced locally whenever possible to create exceptional dishes.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white p-8 rounded-xl shadow-md text-center"
              variants={itemVariants}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
                <Users className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Genuine Hospitality</h3>
              <p className="text-gray-600">
                We treat every guest like family, providing warm, attentive service that makes everyone feel welcome.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white p-8 rounded-xl shadow-md text-center"
              variants={itemVariants}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
                <Award className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Culinary Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in every dish we serve, combining traditional techniques with creative innovation.
              </p>
            </motion.div>

            <motion.div 
              className="bg-white p-8 rounded-xl shadow-md text-center"
              variants={itemVariants}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
                <Heart className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Community Connection</h3>
              <p className="text-gray-600">
                We're committed to our community, supporting local producers and participating in charitable initiatives.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Meet Our Team</h2>
            <div className="h-1 w-16 bg-amber-500 mx-auto mb-8"></div>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Our talented team brings together diverse experiences and a shared passion for creating extraordinary dining experiences.
            </p>
          </div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerVariants}
            initial="initial"
            animate="animate"
          >
            <motion.div 
              className="bg-gray-50 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl"
              variants={itemVariants}
            >
              <img src="/images/chef-1.jpg" alt="Executive Chef" className="w-full h-80 object-cover object-center" />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1 text-gray-800">Michael Roberts</h3>
                <p className="text-amber-600 font-medium mb-4">Executive Chef & Founder</p>
                <p className="text-gray-600">
                  With over 20 years of experience in fine dining, Chef Michael brings his international expertise and passion for innovative cuisine to every dish.
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gray-50 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl"
              variants={itemVariants}
            >
              <img src="/images/chef-2.jpg" alt="Sous Chef" className="w-full h-80 object-cover object-center" />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1 text-gray-800">Jessica Chen</h3>
                <p className="text-amber-600 font-medium mb-4">Sous Chef</p>
                <p className="text-gray-600">
                  Jessica's attention to detail and mastery of flavor combinations help create the distinctive taste that our restaurant is known for.
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gray-50 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl"
              variants={itemVariants}
            >
              <img src="/images/manager.jpg" alt="Restaurant Manager" className="w-full h-80 object-cover object-center" />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1 text-gray-800">David Wilson</h3>
                <p className="text-amber-600 font-medium mb-4">Restaurant Manager</p>
                <p className="text-gray-600">
                  David ensures that every aspect of your dining experience exceeds expectations, from the moment you walk in until your departure.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-amber-600 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Experience {settings.restaurant_name} Today</h2>
            <p className="text-amber-100 mb-8 max-w-2xl mx-auto">
              Join us for a memorable dining experience. Book your table now or explore our menu.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/reservations" className="bg-white text-amber-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
                Reserve a Table
              </a>
              <a href="/menu" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white/10 transition-colors">
                View Menu
              </a>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default About; 