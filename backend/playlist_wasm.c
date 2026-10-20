// Real doubly linked list in C, compiled to WebAssembly.
// Nodes use integer indices instead of host pointers so no JS object manages links.
#define CAP 512
typedef struct Node { int id, prev, next, used; } Node;
static Node nodes[CAP];
static int head=-1,tail=-1,current=-1,next_id=1,seed=1234567;
static int find(int id){for(int p=head;p!=-1;p=nodes[p].next)if(nodes[p].id==id)return p;return -1;}
int add(){int slot=-1;for(int i=0;i<CAP;i++)if(!nodes[i].used){slot=i;break;}if(slot<0)return -1;Node*n=&nodes[slot];n->used=1;n->id=next_id++;n->prev=tail;n->next=-1;if(tail>=0)nodes[tail].next=slot;else head=slot;tail=slot;if(current<0)current=n->id;return n->id;}
int remove_song(int id){int p=find(id);if(p<0)return 0;Node*n=&nodes[p];if(current==id)current=n->next>=0?nodes[n->next].id:(n->prev>=0?nodes[n->prev].id:-1);if(n->prev>=0)nodes[n->prev].next=n->next;else head=n->next;if(n->next>=0)nodes[n->next].prev=n->prev;else tail=n->prev;n->used=0;return 1;}
int play(int id){if(find(id)<0)return 0;current=id;return 1;}
int next_song(){int p=find(current);if(head<0)return current=-1;current=p<0||nodes[p].next<0?nodes[head].id:nodes[nodes[p].next].id;return current;}
int previous_song(){int p=find(current);if(tail<0)return current=-1;current=p<0||nodes[p].prev<0?nodes[tail].id:nodes[nodes[p].prev].id;return current;}
int get_current(){return current;}
int get_count(){int n=0;for(int p=head;p>=0;p=nodes[p].next)n++;return n;}
int get_id_at(int at){int p=head;while(at-->0&&p>=0)p=nodes[p].next;return p<0?-1:nodes[p].id;}
int get_prev_id(int id){int p=find(id);return p<0||nodes[p].prev<0?-1:nodes[nodes[p].prev].id;}
int get_next_id(int id){int p=find(id);return p<0||nodes[p].next<0?-1:nodes[nodes[p].next].id;}
static unsigned int rnd(){seed=seed*1664525u+1013904223u;return (unsigned int)seed;}
void shuffle_songs(){int a[CAP],n=0;for(int p=head;p>=0;p=nodes[p].next)a[n++]=p;for(int i=n-1;i>0;i--){int j=rnd()%(i+1),t=a[i];a[i]=a[j];a[j]=t;}if(!n)return;head=a[0];tail=a[n-1];for(int i=0;i<n;i++){nodes[a[i]].prev=i?a[i-1]:-1;nodes[a[i]].next=i+1<n?a[i+1]:-1;}}
void reset(){for(int i=0;i<CAP;i++)nodes[i].used=0;head=tail=current=-1;next_id=1;}
