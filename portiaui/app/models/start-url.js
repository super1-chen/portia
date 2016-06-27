import Ember from 'ember';
import { flatten } from '../utils/utils';
import { augmentFragmentList, fragmentToString } from '../utils/start-urls';

function generatedURL(spec) {
    let fragments = spec.fragments || [{type: 'fixed', value: spec.url}];
    return {
        url: spec.url,
        type: 'generated',
        fragments: fragments
    };
}

export default function startUrl(spec) {
    let urlObject = {};
    if (spec.type === 'generated') {
        urlObject = generatedURL(spec);
    } else {
        urlObject.url = spec.url;
        urlObject.type = 'url';
    }

    function generateList() {
        // This algorithm is very inefficient due to concatenation and flattening.
        const fragments = Ember.copy(urlObject.fragments);
        let firstFragment = fragments.shiftObject();
        let urlList = [[firstFragment.value]];

        fragments.forEach((fragment) => {
            let augmentedList = urlList.map((fragmentList) => {
                return augmentFragmentList(fragmentList, fragment);
            });
            urlList = flatten(augmentedList);
        });
        return urlList;
    }

    urlObject.save = (spider) => {
        const urls = spider.get('startUrls');
        urls.pushObject(urlObject);
        spider.save();
        return urlObject;
    };

    urlObject.toString = () => {
        if (urlObject.isGenerated) {
            return urlObject.fragments.map(fragmentToString).join('');
        } else {
            return urlObject.url;
        }
    };

    urlObject.serialize = () => {
        let base = {
            'url': urlObject.toString(),
            'type': urlObject.type
        };
        if (urlObject.type === 'generated') {
            base.fragments = urlObject.fragments;
        }
        return base;
    };

    urlObject.isGenerated = urlObject.type === 'generated';

    urlObject.generateList = generateList;

    return urlObject;
}
