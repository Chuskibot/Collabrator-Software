import AddDocumentBtn from '@/components/AddDocumentBtn';
import { DeleteModal } from '@/components/DeleteModal';
import Header from '@/components/Header'
import Notifications from '@/components/Notifications';
import { Button } from '@/components/ui/button'
import { getDocuments } from '@/lib/actions/room.actions';
import { dateConverter } from '@/lib/utils';
import { SignedIn, UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const Home = async () => {
  const clerkUser = await currentUser();
  if(!clerkUser) redirect('/sign-in');

  const roomDocuments = await getDocuments(clerkUser.emailAddresses[0].emailAddress);

  return (
    <main className="home-container">
      <Header className="sticky left-0 top-0 z-50">
        <div className="flex items-center gap-2 lg:gap-4">
          <Notifications />
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </Header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Collaborative Document Editor</h1>
          <p className="hero-subtitle">Create, edit, and collaborate on documents in real-time</p>
          
          {roomDocuments.data.length === 0 && (
            <div className="mt-8">
              <AddDocumentBtn 
                userId={clerkUser.id}
                email={clerkUser.emailAddresses[0].emailAddress}
              />
            </div>
          )}
        </div>
        <div className="hero-image">
          <Image 
            src="/assets/icons/doc.svg"
            alt="Document"
            width={200}
            height={200}
            className="animate-float"
          />
        </div>
      </section>

      {/* Documents Section */}
      {roomDocuments.data.length > 0 ? (
        <section className="documents-section">
          <div className="section-header">
            <h2 className="section-title">Your Documents</h2>
            <AddDocumentBtn 
              userId={clerkUser.id}
              email={clerkUser.emailAddresses[0].emailAddress}
            />
          </div>
          
          <div className="documents-grid">
            {roomDocuments.data.map(({ id, metadata, createdAt }: any) => (
              <div key={id} className="document-card">
                <Link href={`/documents/${id}`} className="document-card-content">
                  <div className="document-icon">
                    <Image 
                      src="/assets/icons/doc.svg"
                      alt="file"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="document-info">
                    <h3 className="document-title">{metadata.title}</h3>
                    <p className="document-date">Created {dateConverter(createdAt)}</p>
                  </div>
                </Link>
                <div className="document-actions">
                  <DeleteModal roomId={id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="empty-state">
          <div className="empty-state-content">
            <h2 className="empty-title">No documents yet</h2>
            <p className="empty-description">Create your first document to get started with collaborative editing</p>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Image 
                src="/assets/icons/users.svg"
                alt="Collaboration"
                width={32}
                height={32}
              />
            </div>
            <h3 className="feature-title">Real-time Collaboration</h3>
            <p className="feature-description">Work together with your team in real-time, seeing changes as they happen</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <Image 
                src="/assets/icons/comment.svg"
                alt="Comments"
                width={32}
                height={32}
              />
            </div>
            <h3 className="feature-title">Threaded Comments</h3>
            <p className="feature-description">Discuss specific parts of your document with inline comments</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <Image 
                src="/assets/icons/bot.svg"
                alt="AI Assistant"
                width={32}
                height={32}
              />
            </div>
            <h3 className="feature-title">VU BOT Assistant</h3>
            <p className="feature-description">Get AI-powered help with writing, editing, and research</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <p>Powered by Varendra University</p>
          <p>© {new Date().getFullYear()} Collaborative Document Editor</p>
        </div>
      </footer>
    </main>
  )
}

export default Home