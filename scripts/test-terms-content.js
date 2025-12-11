const { getTermsContentSafe } = require('../lib/terms-content.ts');

try {
  console.log('Testing terms content loading...');
  const content = getTermsContentSafe();
  
  console.log('✅ Terms content loaded successfully');
  console.log(`Title: ${content.metadata.title}`);
  console.log(`Version: ${content.metadata.version}`);
  console.log(`Last Updated: ${content.metadata.lastUpdated}`);
  console.log(`Sections: ${content.sections.length}`);
  
  content.sections.forEach((section, index) => {
    console.log(`  ${index + 1}. ${section.title} (${section.subsections?.length || 0} subsections)`);
  });
  
} catch (error) {
  console.error('❌ Error testing terms content:', error.message);
  process.exit(1);
}